#ifndef JAIABOT_BIN_MISSION_MANAGER_MISSION_MANAGER_H
#define JAIABOT_BIN_MISSION_MANAGER_MISSION_MANAGER_H

#include <goby/middleware/marshalling/protobuf.h>
// this space intentionally left blank
#include <goby/middleware/frontseat/groups.h>
#include <goby/middleware/protobuf/frontseat_data.pb.h>
#include <goby/zeromq/application/multi_thread.h>

#include "config.pb.h"
#include "jaiabot/groups.h"
#include "jaiabot/messages/jaia_dccl.pb.h"
#include "jaiabot/messages/mission_manager_settings.pb.h"
#include "machine_common.h"

namespace jaiabot
{
namespace apps
{
class MissionManager : public goby::zeromq::MultiThreadApplication<config::MissionManager>
{
  public:
    MissionManager();
    ~MissionManager();

    const config::MissionManager& active_cfg() const;

  private:
    void initialize() override;
    void finalize() override;
    void loop() override;

    void handle_command(const protobuf::Command& command);

    void handle_self_test_results(bool result); // TODO: replace with Protobuf message

    // Handle / publish settings
    void handle_settings(const jaiabot::protobuf::MissionManagerSettings& settings);
    void publish_settings();

    template <typename Derived> friend class statechart::AppMethodsAccess;

  private:
    std::unique_ptr<statechart::MissionManagerStateMachine> machine_;

    config::MissionManager _active_cfg;    
};

} // namespace apps
} // namespace jaiabot

#endif
